export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="text-center">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
            <span className="text-xl font-bold text-white">FF</span>
          </div>
          <span className="text-3xl font-bold text-gray-900">FastFlix</span>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
          Backend{' '}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            API
          </span>
        </h1>

        <p className="mb-8 text-lg text-gray-600">AI-powered movie recommendations service</p>

        {/* API Endpoints */}
        <div className="mx-auto max-w-md space-y-2 text-left">
          <p className="font-mono text-sm text-gray-600">GET /api/health</p>
          <p className="font-mono text-sm text-gray-600">POST /api/check-limit</p>
          <p className="font-mono text-sm text-gray-600">POST /api/search</p>
          <p className="font-mono text-sm text-gray-600">POST /api/subscription/webhook</p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-gray-400">v1.0.0</p>
      </main>
    </div>
  );
}
