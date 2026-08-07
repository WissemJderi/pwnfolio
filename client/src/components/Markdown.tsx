import { isValidElement, useState } from "react";
import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { TbCheck, TbCopy } from "react-icons/tb";

function childrenToText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(childrenToText).join("");
  if (isValidElement(node)) {
    return childrenToText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function CodeBlock({ children, className, ...props }: HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);
  const codeEl = isValidElement(children)
    ? (children as ReactElement<{ className?: string }>)
    : null;
  const codeClass =
    typeof codeEl?.props.className === "string" ? codeEl.props.className : "";
  const lang = codeClass
    .split(/\s+/)
    .find((c) => c.startsWith("language-"))
    ?.replace("language-", "");

  const copy = () => {
    void navigator.clipboard?.writeText(childrenToText(children)).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <pre className={className} {...props}>
      <div className="m-pre-bar">
        <span className="m-pre-lang">{lang ? `${lang}>` : "shell>"}</span>
        <button type="button" className="m-copy" onClick={copy} aria-label="copy code">
          {copied ? <TbCheck size={12} className="text-neon-400" /> : <TbCopy size={12} />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      {children}
    </pre>
  );
}

interface MarkdownProps {
  source: string;
  className?: string;
  size?: "md" | "sm";
}

export function Markdown({ source, className, size = "md" }: MarkdownProps) {
  return (
    <div className={`m-md ${size === "sm" ? "m-md-sm" : ""} ${className ?? ""}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          img: ({ node: _node, ...props }) => <img {...props} loading="lazy" />,
          pre: (props) => <CodeBlock {...props} />,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}