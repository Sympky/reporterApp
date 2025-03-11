# Reporter App

A comprehensive web application for security consultants and penetration testers to manage clients, projects, vulnerabilities, methodologies, and generate professional security reports.

## 🚀 Features

- **Client Management**: Track and manage client information
- **Project Management**: Create and organize projects for clients
- **Vulnerability Database**: Document and categorize security vulnerabilities
- **Methodology Library**: Store and reuse testing methodologies
- **Report Generation**: Create professional security reports with customizable templates
- **Notes & File Management**: Attach notes and files to projects and vulnerabilities
- **Dashboard**: Get a quick overview of your security assessment activities

## 🛠️ Tech Stack

- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React 19 with TypeScript
- **UI Components**: Radix UI, Headless UI, Tailwind CSS
- **Authentication**: Laravel Sanctum
- **Form Handling**: Inertia.js

## 📋 Prerequisites

- PHP 8.2 or higher
- Composer
- Node.js and npm
- MySQL or another database supported by Laravel
- Git

## 🔧 Installation

Follow these steps to get the Reporter App up and running on your local machine:

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/reporterApp.git
cd reporterApp
```

### 2. Install PHP dependencies

```bash
composer install
```

### 3. Install JavaScript dependencies

```bash
npm install
```

### 4. Set up environment variables

```bash
cp .env.example .env
php artisan key:generate
```

Edit the `.env` file to configure your database connection:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=reporter_app
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
```

### 5. Run database migrations

```bash
php artisan migrate
```

### 6. Build frontend assets

```bash
npm run build
```

### 7. Start the development server

```bash
php artisan serve
```

The application will be available at http://localhost:8000

## 🚀 Development Workflow

To start the development environment with hot-reloading:

```bash
composer dev
```

This command will start:
- Laravel development server
- Queue worker
- Log watcher
- Vite development server for frontend

## 📊 Database Structure

The application includes the following key data models:

- **Users**: Authentication and user management
- **Clients**: Client organizations information
- **Projects**: Security assessment projects
- **Vulnerabilities**: Security vulnerabilities with severity ratings
- **Methodologies**: Testing methodologies and procedures
- **Reports**: Generated security reports
- **Report Templates**: Customizable templates for reports
- **Files**: Attached files and evidence
- **Notes**: Notes for projects and vulnerabilities

## 🔒 Authentication

The application uses Laravel Sanctum for API token authentication. Register and login endpoints are provided through the standard Laravel authentication routes.

## 📝 Usage

### Client Management

1. Navigate to the Clients section
2. Add new clients with their contact information
3. View and manage existing clients

### Project Management

1. Create new projects and assign them to clients
2. Track project status and details
3. Attach vulnerabilities and methodologies to projects

### Vulnerability Management

1. Document vulnerabilities discovered during assessments
2. Categorize by severity and type
3. Link vulnerabilities to projects

### Report Generation

1. Select a project
2. Choose a report template
3. Customize the report content
4. Generate and download as DOCX

## 🧪 Testing and Code Coverage

This project uses PHPUnit for testing. Tests are organized into two groups:

- **Unit Tests**: Located in `tests/Unit` directory
- **Feature Tests**: Located in `tests/Feature` directory

### Running Tests

To run all tests:

```bash
./run-tests.sh
```

To run specific test groups:

```bash
./run-tests.sh tests/Unit
./run-tests.sh tests/Feature
```

To run an individual test file:

```bash
./run-tests.sh tests/Unit/Http/Controllers/ProjectControllerTest.php
```

### Code Coverage

To generate code coverage reports, you need Xdebug installed and configured on your PHP environment.

1. **Install Xdebug**:
   - For Ubuntu/Debian: `sudo apt-get install php-xdebug`
   - For macOS with Homebrew: `brew install php@8.2-xdebug`
   - For Windows with XAMPP/WAMP: Enable Xdebug in php.ini

2. **Generate Coverage Report**:

```bash
./run-tests.sh tests/Unit --coverage-html coverage
```

This will generate an HTML coverage report in the `coverage` directory. Open `coverage/index.html` in your browser to view it.

Notes:
- If Xdebug is not installed, the tests will still run, but without generating coverage reports
- The CI/CD pipeline on GitHub Actions is configured to generate coverage reports automatically

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Laravel](https://laravel.com)
- [React](https://reactjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
