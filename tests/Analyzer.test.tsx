import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Analyzer } from "@/components/Analyzer";

describe("Analyzer", () => {
  it("scores a fictional example and explains the highlight", async () => {
    const user = userEvent.setup();
    render(<Analyzer />);

    expect(screen.getByText(/not uploaded/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "English: bank alert" }));

    expect(screen.getByTestId("risk-score").textContent).toMatch(/^\d+$/);
    expect(Number(screen.getByTestId("risk-score").textContent)).toBeGreaterThanOrEqual(60);
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getAllByText(/Chase security/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Credential wording/).length).toBeGreaterThan(0);
  });

  it("asks for a message before scoring an empty box", async () => {
    const user = userEvent.setup();
    render(<Analyzer />);
    await user.click(screen.getByRole("button", { name: "Analyze message" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/paste a message/i);
  });

  it("switches the interface to Arabic, right to left", async () => {
    const user = userEvent.setup();
    render(<Analyzer />);
    await user.click(screen.getByRole("button", { name: "العربية" }));
    const analyze = screen.getByRole("button", { name: "حلّل الرسالة" });
    expect(analyze.closest("[lang='ar']")).toHaveAttribute("dir", "rtl");
  });

  it("switches the interface to Spanish", async () => {
    const user = userEvent.setup();
    render(<Analyzer />);
    await user.click(screen.getByRole("button", { name: "Español" }));
    expect(screen.getByRole("button", { name: "Analizar mensaje" })).toBeInTheDocument();
    expect(screen.getByText("Revisa un mensaje antes de confiar en él.")).toBeInTheDocument();
  });
});
