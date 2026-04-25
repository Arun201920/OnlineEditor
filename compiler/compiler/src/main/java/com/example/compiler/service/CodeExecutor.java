package com.example.compiler.service;

import com.example.compiler.entity.Submission;
import org.springframework.stereotype.Service;
import java.io.*;
import java.nio.file.*;
import java.util.concurrent.TimeUnit;

@Service
public class CodeExecutor {

    public Submission runJava(String code, String input) throws IOException {
        // 1. Create unique workspace
        Path tempDir = Files.createTempDirectory("exec_");
        File sourceFile = new File(tempDir.toFile(), "Main.java");
        Files.writeString(sourceFile.toPath(), code);

        Submission sub = new Submission();
        long start = System.currentTimeMillis();

        try {
            // 2. Compile: javac Main.java
            Process compile = new ProcessBuilder("javac", "Main.java")
                                    .directory(tempDir.toFile()).start();
            if (compile.waitFor() != 0) {
                sub.setStatus("COMPILE_ERROR");
                sub.setError(readStream(compile.getErrorStream()));
                return sub;
            }

            // 3. Run: java Main
            Process run = new ProcessBuilder("java", "Main")
                                .directory(tempDir.toFile()).start();

            // Provide input to program
            if (input != null && !input.isEmpty()) {
                BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(run.getOutputStream()));
                writer.write(input);
                writer.close();
            }

            // 4. Timeout safety
            if (!run.waitFor(3, TimeUnit.SECONDS)) {
                run.destroyForcibly();
                sub.setStatus("TIMEOUT");
            } else {
                sub.setOutput(readStream(run.getInputStream()));
                sub.setError(readStream(run.getErrorStream()));
                sub.setStatus(sub.getError().isEmpty() ? "SUCCESS" : "RUNTIME_ERROR");
            }
        } catch (Exception e) {
            sub.setStatus("SERVER_ERROR");
            sub.setError(e.getMessage());
        } finally {
            sub.setExecutionTime(System.currentTimeMillis() - start);
            // Cleanup files
            deleteDirectory(tempDir.toFile());
        }
        return sub;
    }

    private String readStream(InputStream is) throws IOException {
        BufferedReader r = new BufferedReader(new InputStreamReader(is));
        StringBuilder res = new StringBuilder();
        String line;
        while ((line = r.readLine()) != null) res.append(line).append("\n");
        return res.toString().trim();
    }

    private void deleteDirectory(File dir) {
        File[] files = dir.listFiles();
        if (files != null) for (File f : files) f.delete();
        dir.delete();
    }
}