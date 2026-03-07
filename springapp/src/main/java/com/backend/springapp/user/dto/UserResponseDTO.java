package com.backend.springapp.user.dto;

import lombok.Data;

@Data
public class UserResponseDTO {

    private Long uid;
    private String username;
    private String email;
    private String lcusername;
    /** Opaque session token — sent back to the extension for authenticated sync requests. */
    private String sessionToken;

    /** Phase 2: JWT token — frontend / extension can start using this instead of sessionToken. */
    private String token;

    private Integer graduationYear;
    private int rating;
    private Long institutionId;
    private String institutionName;
}
