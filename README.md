# The Wyldrift

Secure Node.js + Express + MongoDB + Cloudinary admin product system.

## 🤝 Team Collaboration

This project is set up for team collaboration using Git and GitHub.

### Repository Setup

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/thewyldrift.git
cd thewyldrift
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up your environment:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

### Branch Strategy

- **`main`** - Production-ready code
- **`develop`** - Integration branch for features
- **`feature/*`** - Individual feature branches
- **`bugfix/*`** - Bug fixes
- **`hotfix/*`** - Critical fixes for production

### Workflow

1. **Create a feature branch:**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes and commit:**
```bash
git add .
git commit -m "feat: add your feature description"
```

3. **Push and create a pull request:**
```bash
git push origin feature/your-feature-name
# Create PR on GitHub
```

### Commit Message Convention

Use conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code formatting
- `refactor:` - Code refactoring
- `test:` - Test additions
- `chore:` - Maintenance tasks

### Code Review Process

1. All changes must be submitted via Pull Request
2. At least one team member must approve
3. Automated tests must pass
4. Merge to `develop` branch first
5. Deploy from `develop` to `main` after testing

### Environment Setup

Each team member needs their own `.env` file:

```env
PORT=8080
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:8080
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/thewyldrift
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_PASSKEY=1234567899
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Seed admin data
npm run seed:admin
```

### Conflict Resolution

1. **Pull latest changes before starting:**
```bash
git checkout main
git pull origin main
```

2. **Rebase your branch:**
```bash
git checkout feature/your-feature
git rebase main
```

3. **Resolve conflicts and continue:**
```bash
git add .
git rebase --continue
```

### Deployment

- **Development:** Automatically deployed from `develop` branch
- **Production:** Manually deployed from `main` branch after review

### Communication

- **Discord/Slack:** Daily standups and progress updates
- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** General questions and planning

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
ADMIN_PASSKEY=99
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
