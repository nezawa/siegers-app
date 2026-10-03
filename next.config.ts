import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 旧「ブログ」の URL を News に転送する（共有済みのリンク対策）
  async redirects() {
    return [
      { source: "/blog", destination: "/news", permanent: true },
      { source: "/blog/:path*", destination: "/news/:path*", permanent: true },
      // 管理用の記事一覧は廃止（投稿・編集・削除は /news から行う）。
      // :path* は0階層にもマッチするので、完全一致のほうを先に書く
      { source: "/admin/blog", destination: "/news", permanent: false },
      { source: "/admin/news", destination: "/news", permanent: false },
      { source: "/admin/blog/:path*", destination: "/admin/news/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
