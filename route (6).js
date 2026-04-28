import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-[#D85A30]"></div>
        <h1 className="text-3xl font-bold text-gray-900">CrateHQ</h1>
      </div>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Distribution management for Kenyan retailers
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 bg-[#D85A30] text-white rounded-xl font-medium hover:bg-[#c44e28] transition"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="px-6 py-3 bg-white text-[#D85A30] border border-[#D85A30] rounded-xl font-medium hover:bg-orange-50 transition"
        >
          Register
        </Link>
      </div>
    </main>
  );
}
