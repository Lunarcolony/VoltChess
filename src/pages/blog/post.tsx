import { Navigate, useParams } from "react-router-dom";
import { getBlogPost } from "@/data/blogPosts";
import BlogArticle from "@/sections/blog/BlogArticle";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) return <Navigate to="/blog" replace />;

  return <BlogArticle post={post} />;
}
