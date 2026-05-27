export default function PageWrapper({ children }) {
  return (
    <main className="max-w-2xl mx-auto w-full px-4 py-6">
      {children}
    </main>
  );
}
