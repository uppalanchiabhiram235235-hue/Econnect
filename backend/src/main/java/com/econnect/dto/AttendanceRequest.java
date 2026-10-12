package com.econnect.dto;

import com.econnect.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;

public record AttendanceRequest(@NotNull AttendanceStatus attendanceStatus) {
}
