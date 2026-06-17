describe("smoke", () => {
  it("math works", () => {
    expect(1 + 1).toBe(2);
  });

  it("jest-dom matchers available", () => {
    const el = document.createElement("div");
    el.textContent = "hello";
    document.body.appendChild(el);
    expect(el).toBeInTheDocument();
    el.remove();
  });
});
