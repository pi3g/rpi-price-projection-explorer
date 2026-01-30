# Deployment Guide

This project is built using React, TypeScript, and Vite. It is designed to be built into a static frontend-only webpage.

## Building the Project

To build the project, run the following command in the root directory:

```bash
npm run build
```

This will create a `dist` directory containing all the static files (HTML, CSS, JS, and assets).

## Deploying to Nginx

To deploy these files to an Nginx server:

1.  Build the project as shown above.
2.  Copy the contents of the `dist` directory to your Nginx web root (usually `/var/www/html` or similar).

### Example Nginx Configuration

Here is a basic Nginx configuration snippet for serving this static site:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /var/www/html; # Path to your dist folder contents
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

### Key Files to Copy
- `index.html`
- `assets/` (contains bundled JS and CSS)
- `vite.svg` (and any other static assets in the root of `dist`)

## Static Hosting Alternatives

Since this is a static site, you can also host it on:
- GitHub Pages
- Vercel
- Netlify
- AWS S3 / CloudFront
- Google Cloud Storage
