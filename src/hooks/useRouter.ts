import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

export interface Router {
  push: (url: string) => void;
  replace: (url: string) => void;
  back: () => void;
  pathname: string;
  query: Record<string, string | string[]>;
  asPath: string;
}

export const useRouter = (): Router => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Convert URLSearchParams to query object
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    if (query[key]) {
      // Handle multiple values for the same key
      if (Array.isArray(query[key])) {
        (query[key] as string[]).push(value);
      } else {
        query[key] = [query[key] as string, value];
      }
    } else {
      query[key] = value;
    }
  }

  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    pathname: location.pathname,
    query,
    asPath: location.pathname + location.search,
  };
};
