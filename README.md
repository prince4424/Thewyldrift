# The Wyldrift

Secure Node.js + Express + MongoDB + Cloudinary admin product system.

## Setup

1. Install dependencies:

```powershell
npm install
```

2. Fill `.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/thewyldrift
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_PASSKEY=1234567899
JWT_SECRET=your_long_random_secret
```

3. Seed the admin passkey into MongoDB as a bcrypt hash:

```powershell
npm run seed:admin
```

4. Start the app:

```powershell
npm run dev
```

Open:

- Storefront: `http://localhost:8080`
- Admin panel: `http://localhost:8080/admin.html`

## API

Auth:

- `POST /api/admin/login`

Products:

- `POST /api/products`
- `GET /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

Admin product create/update/delete routes require:

```http
Authorization: Bearer <jwt>
```

Product image uploads use `multipart/form-data` with the field name `images`.

## GitHub

Git is initialized locally. To connect this folder to a GitHub repository:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/thewyldrift.git
git branch -M main
git add .
git commit -m "Initial secure product admin system"
git push -u origin main
```

If you install GitHub CLI later:

```powershell
gh auth login
gh repo create thewyldrift --private --source=. --remote=origin --push
```

## MongoDB

This app expects MongoDB at the value in `MONGODB_URI`.

Options:

- Local MongoDB Community Server: install it on Windows, start the MongoDB service, then use `mongodb://127.0.0.1:27017/thewyldrift`.
- MongoDB Atlas: create a free cluster and replace `MONGODB_URI` with your Atlas connection string.

## Notes

- `.env` is ignored by Git.
- The admin passkey is never hardcoded in route logic. It is read from `.env` only during `npm run seed:admin`, hashed with bcrypt, and saved in MongoDB.
- Cloudinary `publicId` values are saved with image URLs so replaced/deleted product images can also be removed from Cloudinary.
