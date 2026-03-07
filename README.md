# EduLink

EduLink is a full-stack e-learning platform for creating, selling, and completing structured online courses.

Instructors can build and publish module-based courses with video and quiz lessons, while students can enroll, learn at their own pace, and track progress across lessons. The platform is powered by Next.js App Router, MongoDB (Mongoose), Razorpay, ImageKit, and Resend.

## Highlights

- JWT auth with email verification and password reset.
- Role-based experience: `student` and `instructor`.
- Course creation with modules and lessons (`video` or `quiz`).
- Secure media uploads via ImageKit auth endpoint.
- Razorpay order + webhook-based enrollment.
- Learning mode with video progress tracking and quiz attempts/results.
- React Email templates for auth/payment notifications.

## Tech Stack

- Framework: Next.js 15 (App Router), React 19, TypeScript
- Styling: Tailwind CSS 4
- State: Redux Toolkit + Redux Persist
- Database: MongoDB + Mongoose
- Auth: JWT + HTTP-only cookie
- Payments: Razorpay
- Media: ImageKit
- Emails: Resend + React Email

## User Roles

- `student`
  - Browse and enroll in published courses
  - Consume lessons, take quizzes, track progress
  - View order history and rate enrolled courses
- `instructor`
  - Create/update/publish courses
  - Manage modules, video lessons, and quiz lessons
  - Monitor course structure and enrollment-facing content

Users can switch roles from the navbar profile menu (`/api/users/change-role`).

## Email Notifications

Emails are sent via Resend using React Email templates.

- Verification email on sign-up
- Forgot password email with reset link
- Password reset confirmation email
- Course enrollment success email (webhook success path)
- Payment failed email (webhook failure path)

## Environment Variables

Create a `.env.local` file in the project root.

```bash
# Database
MONGODB_URI=
DB_NAME=

# Auth
JWT_SECRET=

# URLs
DOMAIN_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=
SUPPORT_EMAIL=

# ImageKit
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_PUBLIC_KEY=

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Notes:

- `IMAGEKIT_PUBLIC_KEY` is returned by `/api/imagekit-auth` to client uploads.
- Razorpay amounts are stored/processed in paise (`INR`).
- `DOMAIN_URL` is used in verification/reset links and email footer links.

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Start development server

```bash
npm run dev
```

Open `http://localhost:3000`.

### 3. Lint

```bash
npm run lint
```

### 4. Production build

```bash
npm run build
npm start
```

## NPM Scripts

- `npm run dev`: start dev server with Turbopack
- `npm run build`: production build with Turbopack
- `npm start`: start production server
- `npm run lint`: run ESLint

## Core Flows

### Student Flow

1. Sign up and verify email using OTP.
2. Sign in and browse `/courses`.
3. Enroll via Razorpay checkout from course detail page.
4. Payment webhook marks order status and creates enrollment.
5. Learn via video/quiz lessons, with progress persisted server-side.

### Instructor Flow

1. Switch role to `instructor`.
2. Create a course with thumbnail upload.
3. Add modules.
4. Add video lessons or quiz lessons.
5. Edit/publish course and manage content updates.
