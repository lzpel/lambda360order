"use client";
import Lambda360Form, { type Lambda, type TextInput, type Input, type Output } from '@widget/Lambda360Form';

type InputSchema={
  company: TextInput,
  name: TextInput,
  email: TextInput,
  body: TextInput,
}
const input: InputSchema = {
  company: { type: "text", label: "会社名", placeholder: "株式会社〇〇", value: "" },
  name: { type: "text", label: "お名前", placeholder: "山田 太郎", value: "" },
  email: { type: "text", label: "メールアドレス", variant: "email", placeholder: "example@example.com", value: "" },
  body: { type: "text", label: "お問い合わせ内容", variant: "area", placeholder: "ご相談・ご質問内容をご記入ください", value: "" },
};

const lambda: Lambda = (params: Record<string, Input>): Output[] => {
  const input: InputSchema = params as InputSchema;
  return [
  {
    type: "action",
    label: "送信する",
    subject: `【KatachiForm お問い合わせ】${input.company || ""}${input.name ? " " + input.name : ""}`,
    email_to: ["info@surfic.com"],
    email_bcc: [String(input.email)],
    slack: [],
    disable: input.email ? false : "メールアドレスを入力してください",
  },
];
}

export default function ContactForm() {
  return (
    <Lambda360Form
      input={input}
      lambda={lambda}
      side="none"
      serverUrl={process.env.SERVER_URL}
    />
  );
}
