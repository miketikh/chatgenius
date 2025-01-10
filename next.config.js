/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        port: "",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
        port: "",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "chatgenius-mike.s3.us-east-2.amazonaws.com",
        port: "",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
        port: "",
        pathname: "/**"
      }
    ]
  },
  devIndicators: {
    appIsrStatus: false
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  }
}

module.exports = nextConfig
