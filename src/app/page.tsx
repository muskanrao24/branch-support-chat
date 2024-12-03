"use client";
import React, { useEffect, useState } from "react";
import { FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

function Page() {
  const router = useRouter();
  const [formData, setFormData] = useState<{
    UUID: string;
    role: "agent" | "customer";
    username: string;
  }>({
    UUID: generateUUID(),
    role: "agent",
    username: "",
  });

  const handleSelectElementChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    event.preventDefault();

    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const registerUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const response = await fetch("/api/agentRegister", {
      method: "POST",
      body: JSON.stringify(formData),
    });
    if (response.ok) {
      const data = await response.json();

      sessionStorage.setItem("UUID", formData.UUID);
      sessionStorage.setItem("ROLE", formData.role);
      sessionStorage.setItem("DBID", data["dbId"]);
      sessionStorage.setItem("NAME", formData.username);

      if (formData.role === "agent") router.push("/chat");
      else router.push("/support");
    }
  };

  function generateUUID() {
    return uuidv4().toString();
  }

  useEffect(() => {
    if (sessionStorage.getItem("UUID")) {
      if (sessionStorage.getItem("ROLE") === "agent") {
        router.push("/chat");
      } else {
        router.push("/support");
      }
    }
  }, [router]);

  // Animate Create button to prevent multiple clicks
  type ButtonState = "normal" | "loading";
  const [buttonState, setButtonState] = useState<ButtonState>("normal");

  const changeState = () => {
    setButtonState("loading");
  };

  return (
    <div className="bg-[#e0f7fa] w-full h-full grid place-items-center min-h-screen">
      <div className="bg-[#80deea] flex flex-col items-center p-6 rounded-lg max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-6 mt-6 text-[#0288d1]">Login</h1>
        <form className="flex flex-col" onSubmit={registerUser}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            required
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            className="focus:border-0 focus:outline-0 bg-[#e0f7fa] rounded-md p-3 mb-6 text-[#0288d1] border border-[#80deea] text-center"
          />
          <select
            name="role"
            onChange={handleSelectElementChange}
            value={formData.role}
            className="focus:border-0 focus:outline-0 bg-[#e0f7fa] rounded-md p-3 mb-6 text-[#0288d1] border border-[#80deea] text-center"
          >
            <option value="agent">Agent</option>
            <option value="customer">Customer</option>
          </select>
          <input required type="hidden" name="UUID" value={formData.UUID} />
          <button
            className="bg-[#0288d1] text-white p-3 rounded-md flex items-center justify-center"
            type="submit"
            onClick={changeState}
          >
            {buttonState === "normal" ? (
              "Login"
            ) : (
              <svg
                aria-hidden="true"
                role="status"
                className="inline mr-2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="#0288d1"
                ></path>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Page;
