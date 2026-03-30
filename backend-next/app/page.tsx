import Image from 'next/image';
import Logo from '../app/assets/logo.png';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="text-center">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center space-x-3">
          <div className="flex h-12 w-12 items-center rounded justify-center">
            <Image src={Logo} alt="FastFlix Logo" className="rounded" width={48} height={48} />
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
        <div className="mx-auto max-w-md space-y-3 text-left">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Health</p>
            <p className="font-mono text-sm text-gray-600">GET /api/health</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Auth</p>
            <p className="font-mono text-sm text-gray-600">POST /api/auth/apple</p>
            <p className="font-mono text-sm text-gray-600">POST /api/auth/google</p>
            <p className="font-mono text-sm text-gray-600">GET /api/auth/me</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Trial</p>
            <p className="font-mono text-sm text-gray-600">GET /api/trial</p>
            <p className="font-mono text-sm text-gray-600">POST /api/trial</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Search</p>
            <p className="font-mono text-sm text-gray-600">POST /api/search</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Subscription</p>
            <p className="font-mono text-sm text-gray-600">POST /api/subscription/webhook</p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-gray-400">v1.0.0</p>
      </main>
    </div>
  );
}
