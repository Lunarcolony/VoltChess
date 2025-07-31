
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    body {
      background: radial-gradient(circle, #0f172a, #000);
    }
    .animate-fade {
      animation: fadeIn 1.5s ease-in-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body class="text-white font-sans">

  <!-- Hero -->
  <section class="text-center py-20 px-4 animate-fade">
    <h1 class="text-5xl font-bold text-yellow-400 mb-4">VoltChess ⚡</h1>
    <p class="text-lg text-gray-300 max-w-2xl mx-auto">
      A powerful, open-source chess platform with a beautiful GUI and real-time Stockfish analysis.
    </p>
    <div class="mt-6 space-x-4">
      <a href="https://github.com/Lunarcolony/VoltChess" target="_blank" class="bg-yellow-400 hover:bg-yellow-300 text-black px-5 py-2 rounded-md font-medium">GitHub</a>
      <a href="https://discord.gg/yourdiscordlink" target="_blank" class="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-md font-medium">Join Discord</a>
      <a href="https://voltchess.vercel.app" target="_blank" class="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-md font-medium">Try Demo</a>
    </div>
  </section>

  <!-- Features -->
  <section class="max-w-5xl mx-auto px-4 py-12 animate-fade">
    <h2 class="text-3xl font-bold text-center mb-10">⚙️ Features</h2>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 class="text-xl font-semibold mb-2 text-yellow-300">Stockfish Integration</h3>
        <p class="text-gray-400">Analyze positions in real-time using the powerful Stockfish engine.</p>
      </div>
      <div class="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 class="text-xl font-semibold mb-2 text-yellow-300">React-based UI</h3>
        <p class="text-gray-400">Sleek and responsive interface built using React and modern web technologies.</p>
      </div>
      <div class="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 class="text-xl font-semibold mb-2 text-yellow-300">Community Driven</h3>
        <p class="text-gray-400">Contribute on GitHub and join the growing community of chess developers.</p>
      </div>
      <div class="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 class="text-xl font-semibold mb-2 text-yellow-300">No Login Needed</h3>
        <p class="text-gray-400">Play and analyze without any account — open and instant.</p>
      </div>
      <div class="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 class="text-xl font-semibold mb-2 text-yellow-300">Multiplatform Ready</h3>
        <p class="text-gray-400">Works on desktop and mobile seamlessly, so you can play anywhere.</p>
      </div>
      <div class="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 class="text-xl font-semibold mb-2 text-yellow-300">Future Plans</h3>
        <p class="text-gray-400">Opening explorer, friend system, Discord bots, tournaments and more.</p>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="text-center py-6 text-sm text-gray-500 animate-fade">
    <p>&copy; 2025 VoltChess by Jatash and the community. Built with ♟️ and ⚡.</p>
  </footer>

  <script>
    // Just a basic console greeting
    console.log("Welcome to VoltChess!");
  </script>
</body>
</html>
