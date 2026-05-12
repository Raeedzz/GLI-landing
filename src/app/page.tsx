import Socials from "./_components/Socials";
import HeroCanvas from "./_components/HeroCanvas";
import DownloadButton from "./_components/DownloadButton";
import Logo from "./_components/Logo";
import Features from "./_components/Features";

export default function Page() {
  return (
    <>
      <SeoContent />
      <Logo />
      <main className="h-[100svh] w-full overflow-y-scroll bg-black no-scrollbar">
        <section
          id="hero"
          className="h-[160svh] w-full"
          aria-hidden="true"
        />
        <Features />
        <Socials />
        <HeroCanvas />
        <DownloadButton />
      </main>
    </>
  );
}

function SeoContent() {
  return (
    <div className="sr-only">
      <h1>
        Goonware — a GPU-accelerated open-source terminal for multi-agent
        orchestration
      </h1>
      <p>
        Goonware is a GPU-accelerated open-source terminal built for
        multi-agent AI orchestration. Lightning-fast and harness-free, with
        per-agent git worktrees, a built-in browser faster than Chrome MCP,
        full git tree management, and live agent activity summaries. Free
        download for Mac.
      </p>
      <a
        href="https://github.com/sckryteam/GLI/releases/latest/download/Goonware.dmg"
        rel="noopener"
      >
        Download Goonware for Mac
      </a>
      <h2>Features</h2>
      <ul>
        <li>
          <h3>No harness, just a lightning-fast terminal</h3>
          <p>
            Pure GPU-accelerated terminal with no harness overhead, optimized
            for instant response and full keyboard control.
          </p>
        </li>
        <li>
          <h3>Worktrees spun up for each of your agents</h3>
          <p>
            Every agent gets its own isolated git worktree, so multiple agents
            can work in parallel without colliding on the same branch.
          </p>
        </li>
        <li>
          <h3>Built-in browser faster than any in Chrome MCP</h3>
          <p>
            A native browser pane embedded directly in the terminal, faster
            than Chrome MCP, perfect for opening links and inspecting pages
            without leaving your flow.
          </p>
        </li>
        <li>
          <h3>Full git tree management</h3>
          <p>
            See diffs, stage hunks, manage branches, and ship pull requests
            from inside the terminal with a complete git tree view.
          </p>
        </li>
        <li>
          <h3>Summaries of what your agents are doing</h3>
          <p>
            Live, plain-English summaries of every agent&rsquo;s recent work,
            so you can review what shipped without reading every line of
            output.
          </p>
        </li>
      </ul>
      <h2>Connect</h2>
      <ul>
        <li>
          <a href="https://github.com/Raeedzz/GLI" rel="noopener">
            Goonware on GitHub
          </a>
        </li>
        <li>
          <a href="https://www.linkedin.com/in/raeedz/" rel="noopener">
            Raeed Zaman on LinkedIn
          </a>
        </li>
        <li>
          <a
            href="https://www.instagram.com/raeedmakesshit"
            rel="noopener"
          >
            Raeed Zaman on Instagram
          </a>
        </li>
      </ul>
    </div>
  );
}
