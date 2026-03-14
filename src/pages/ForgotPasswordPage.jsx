import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    const redirectTo =
      window.location.origin.includes("localhost")
        ? "http://localhost:5173/#/reset-password"
        : "https://fitflow1.pages.dev/#/reset-password";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setMessage("이메일 전송 실패");
    } else {
      setMessage("비밀번호 재설정 링크를 이메일로 보냈습니다.");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>비밀번호 재설정</h2>

      <input
        type="email"
        placeholder="이메일 입력"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={handleReset}>
        재설정 링크 보내기
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}