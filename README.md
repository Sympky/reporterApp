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

## 📋 Prerequisites

- PHP 8.2 or higher
- Composer
- Node.js and npm
- MySQL or another database supported by Laravel
- Git

## 🔧 Installation

You can install the Reporter App either manually or using Docker.

### Option 1: Manual Installation

Follow these steps to get the Reporter App up and running on your local machine:

### 1. Clone the repository

```bash
git clone https://github.com/Sympky/reporterApp.git
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

### Option 2: Docker Installation

This application includes Docker configurations for easy setup.

#### Prerequisites

- Docker
- Docker Compose

#### Steps

1. Clone the repository

```bash
git clone https://github.com/Sympky/reporterApp.git
cd reporterApp
```

2. Create a copy of the environment file

```bash
cp .env.example .env
```

3. Update the environment variables in `.env` for Docker:

```
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=reporter_app
DB_USERNAME=reporter
DB_PASSWORD=your_secure_password
```

4. Start the Docker containers

```bash
docker-compose up -d
```

5. Set up the application

```bash
# Enter the app container
docker-compose exec app bash

# Inside the container, run:
php artisan key:generate
php artisan migrate
php artisan storage:link
exit
```

6. Access the application

The application will be available at http://localhost:8000

#### Useful Docker Commands

```bash
# Stop the containers
docker-compose down

# View container logs
docker-compose logs -f

# Rebuild containers after making changes to Dockerfile
docker-compose up -d --build
```



## 🧪 Testing and Code Coverage

This project uses PHPUnit for testing. Tests are organized into two groups:

- **Unit Tests**: Located in `tests/Unit` directory
- **Feature Tests**: Located in `tests/Feature` directory

### Running Tests

To run all tests:

```bash
php artisan test
```

To run specific test groups:

```bash
php artisan test tests/Unit
php artisan test tests/Feature
```

To run an individual test file:

```bash
php artisan test tests/Unit/Http/Controllers/ProjectControllerTest.php
```



## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Laravel](https://laravel.com)
- [React](https://reactjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
