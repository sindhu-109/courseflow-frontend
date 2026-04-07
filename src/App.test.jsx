import { render, screen } from "@testing-library/react";
import App from "./App.jsx";

test("renders the CourseFlow home page", async () => {
  render(<App />);

  expect(await screen.findByText("CourseFlow")).toBeInTheDocument();
});
