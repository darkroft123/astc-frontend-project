const TAG = "📡 AUTH_API";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: {
      id: string;
      code: string;
      name: string;
    };
  };
}

import { getApiBaseUrl } from "@/lib/api-host";

export async function loginApi(input: LoginInput): Promise<LoginResponse> {
  const url = getApiBaseUrl(3010);

  console.log(TAG, "LOGIN REQUEST →", url);

  try {
    const res = await fetch(`${url}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    console.log(TAG, "STATUS:", res.status);

    const data = await res.json();

    console.log(TAG, "RESPONSE:", data);

    if (!res.ok) {
      throw new Error(data.message || "Error de inicio de sesión");
    }

    return data;
  } catch (err) {
    console.error(TAG, "ERROR:", err);
    throw err;
  }
}