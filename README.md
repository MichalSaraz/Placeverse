# Placeverse

Placeverse is a web application for managing, sharing, and tracking interesting places and personal travel experiences. The project is built with Nuxt 3, Supabase, TypeScript, and Tailwind CSS.

---

## 🚀 Features & Use Cases

- User registration and login (Supabase Auth)
- Add, edit, and delete locations
- Track visited places
- Add photos to locations
- Manage photo gallery (via location detail)
- Share links to social media
- Mobile optimization
- Secure data storage (RLS policies in Supabase)

---

## 🛠️ Tech Stack

- **Nuxt 3** (Vue 3, SSR/SPA)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (PostgreSQL, Auth, Storage)
- **Zod** (form validation)

---

## 📁 Project Structure

```
app.vue
nuxt.config.ts
package.json
tsconfig.json
assets/           # CSS, images
components/       # UI components (forms, layouts, buttons)
database/         # SQL scripts for Supabase (triggers, policies)
layouts/          # Page layouts
middleware/       # Auth middleware
pages/            # Main pages (index, login, register, location/add, location/edit)
public/           # Static files (favicon, images)
server/           # Server-side code (if used)
types/            # TypeScript types
utils/            # Helper utilities
```

---

## ⚡ Setup & Development

1. **Clone the repository:**

   ```bash
   git clone https://github.com/MichalSaraz/placeverse.git
   cd placeverse
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Configure environment variables:**

   - Create a `.env` file based on `.env.example`
   - Fill in:
     ```
     SUPABASE_URL="https://your-project-id.supabase.co"
     SUPABASE_KEY="your-anon-public-key"
     ```

4. **Start the development server:**

   ```bash
   pnpm dev
   ```

   - Default address: [http://localhost:3000](http://localhost:3000)

5. **Supabase setup:**
   - All database operations, policies, and storage are managed via [Supabase.com](https://supabase.com)

---

## � Deployment (Vercel)

- Deployed on: Vercel — https://vercel.com/michal-sarazs-projects/placeverse
- Build command: `pnpm build`
- Environment variables required on Vercel:
  - `SUPABASE_URL` — your Supabase project URL
  - `SUPABASE_KEY` — your Supabase anon/public key (or service role where appropriate)
- Recommended Vercel settings:
  - Framework preset: Auto / Nuxt
  - Node version: 18+
  - Production Branch: `main` (optional)

---

## �🗄️ Supabase Notes

- **RLS policies:** Make sure you have correct INSERT, SELECT, UPDATE policies (see documentation)
- **Storage:** Photos are stored in Supabase Storage; triggers for deletion are in `database/cascade_delete_photos.sql`
- **Auth:** Uses Supabase Auth (email/password)

---

## 📦 Key Dependencies

- Nuxt: ^3.17.3
- Supabase: ^2.49.8
- TailwindCSS: ^4.1.7
- TypeScript: ^5.6.3
- Zod: ^3.25.49

---

## 📝 License & Authors

- Author: Michal Saraz
- License: MIT (see project settings)
