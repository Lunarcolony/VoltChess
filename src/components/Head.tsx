import { useEffect } from "react";

interface HeadProps {
  children: React.ReactNode;
}

function upsertLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`;
  let link = document.querySelector(selector) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

const Head: React.FC<HeadProps> = ({ children }) => {
  useEffect(() => {
    const processChildren = (nodes: React.ReactNode) => {
      if (!nodes) return;

      const childArray = Array.isArray(nodes) ? nodes : [nodes];

      childArray.forEach((child) => {
        if (child && typeof child === "object" && "type" in child) {
          const element = child as React.ReactElement;

          if (element.type === "title") {
            document.title = element.props.children;
          } else if (element.type === "meta") {
            const { name, property, content } = element.props;
            if (name || property) {
              const existingMeta = document.querySelector(
                `meta[${name ? "name" : "property"}="${name || property}"]`
              );
              if (existingMeta) {
                existingMeta.remove();
              }

              const meta = document.createElement("meta");
              if (name) meta.setAttribute("name", name);
              if (property) meta.setAttribute("property", property);
              if (content) meta.setAttribute("content", content);
              document.head.appendChild(meta);
            }
          } else if (element.type === "link") {
            const { rel, href } = element.props;
            if (rel && href) {
              upsertLink(rel, href);
            }
          }
        }
      });
    };

    processChildren(children);
  }, [children]);

  return null;
};

export default Head;
