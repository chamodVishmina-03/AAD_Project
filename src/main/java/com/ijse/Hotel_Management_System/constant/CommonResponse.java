package com.ijse.Hotel_Management_System.constant;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CommonResponse {
    private int status;
    private Object body;
    private String message;

    public CommonResponse(String message, int status) {
        this.status = status;
        this.message = message;
    }
}
