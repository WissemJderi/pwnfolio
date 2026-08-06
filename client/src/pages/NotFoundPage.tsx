import { Link } from "react-router-dom";

export const NotFoundPage = () => (
  <div className="py-24 text-center">
    <p className="text-5xl font-black text-slate-700">404</p>
    <p className="mt-4 text-slate-400">This page does not exist.</p>
    <Link to="/" className="btn-primary mt-6 inline-flex">
      Back to writeups
    </Link>
  </div>
);
