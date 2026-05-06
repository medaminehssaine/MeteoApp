package com.meteoproject.dto.corrective;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class UpdateCorrectiveRequest {

    @Size(max = 500, message = "Title must not exceed 500 characters")
    private String title;

    private String description;

    private String priority;

    private String status;

    private UUID assignedToId;

    private LocalDate dueDate;
}
