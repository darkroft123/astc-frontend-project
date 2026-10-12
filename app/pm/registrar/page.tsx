"use client";

import BiometricRegistrationView from "@/components/attendance/BiometricRegistrationView";

export default function RegisterAttendancePage() {
  return (
    <BiometricRegistrationView
      allowedRoles={["PROJECT_MANAGER"]}
      previewRoute="/pm/registrar/prev"
      vacationsRoute="/pm/vacaciones"
      homeRoute="/pm"
    />
  );
}
