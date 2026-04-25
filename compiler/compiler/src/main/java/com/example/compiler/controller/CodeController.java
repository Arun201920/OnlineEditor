package com.example.compiler.controller;

import com.example.compiler.entity.Submission;
import com.example.compiler.repository.SubmissionRepository;
import com.example.compiler.service.CodeExecutor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/code")
@CrossOrigin("http://localhost:5173") 
public class CodeController {

    @Autowired private CodeExecutor executor;
    @Autowired private SubmissionRepository repo;

    @PostMapping("/run")
    public Submission run(@RequestBody Submission request) throws Exception {
        Submission result = executor.runJava(request.getCode(), request.getInput());
        result.setCode(request.getCode());
        result.setLanguage("java");
        return repo.save(result); // Saves to DB and returns
    }

    @GetMapping("/history")
    public List<Submission> getHistory() {
        return repo.findAll();
    }
}