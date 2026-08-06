import { Link } from "react-router-dom";

export const NotFoundPage = () => (
  <div className="py-24 text-center">
    <p className="font-mono text-6xl font-black text-blood-400">404</p>
    <p className="mt-6 font-mono text-sm text-ink-400 cursor">
      $ cat /writeups/this-page
    </p>
    <p className="mt-2 font-mono text-sm text-ink-500">
      cat: machine not found. the owner has likely taken it down.
    </p>
    <Link to="/" className="btn btn-primary mt-8 inline-flex text-xs">
      cd ~
    </Link>
  </div>
);