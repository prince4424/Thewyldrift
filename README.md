
# The Wyldrift Storefront

A responsive e-commerce store with admin panel and Cloudinary image upload support.

## Project Structure

```
THEWYLDRIFT/
├── client/                 ← Deploy this folder on Vercel
│   ├── index.html         (Storefront)
│   ├── admin.html         (Admin panel)
│   ├── script.js
│   ├── admin.js
│   └── styles.css
├── server/                 ← Run this locally or on a backend server
│   ├── server.js          (Node.js HTTP server)
│   ├── db.json            (Product database)
│   └── .env               (Environment variables)
├── .gitignore
└── README.md
```

## Local Development

### Start the backend server

```bash
cd server
node server.js
```

The server will display:
- Storefront: `http://localhost:8080`
- Admin panel: `http://localhost:8080/admin.html`
- Network access: `http://<your-ip>:8080`

### Features

- **Storefront**: Browse products by category, view details, contact via WhatsApp
- **Admin Panel**: Add/edit/delete products with sizes and images
- **Image Upload**: Upload images directly from admin panel to Cloudinary
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Authentication**: Password-protected admin panel

## Configuration

Create a `server/.env` file:

```env
ADMIN_PASSKEY=your-secure-password
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
CLOUDINARY_UPLOAD_PRESET=optional-preset
```

## Deployment

### Deploy Client on Vercel

1. Push the entire project to GitHub
2. On Vercel, create a new project and select your GitHub repo
3. Set the **Root Directory** to `client`
4. Deploy

Your storefront will be live!

### Deployment Notes

- The client (frontend) is deployed on Vercel
- The server (backend) can run on any Node.js host (Heroku, Railway, etc.)
- Update the API endpoint in `client/admin.js` if your server is on a different domain

## Database

Products are stored in `server/db.json`. Each product has:
- `id`, `name`, `category`, `price`, `stock`, `sizes`, `image`, `details`, `active`
- `createdAt`, `updatedAt` timestamps
