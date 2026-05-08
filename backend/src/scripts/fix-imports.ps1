$content = Get-Content "seed-data.ts" -Raw
$content = $content -replace "import Category from '../models/Category.model'", "import { Category } from '../models/Category.model'"
$content = $content -replace "import Teacher from '../models/Teacher.model'", "import { Teacher } from '../models/Teacher.model'"
$content = $content -replace "import Course from '../models/Course.model'", "import { Course } from '../models/Course.model'"
$content = $content -replace "import User from '../models/User.model'", "import { User } from '../models/User.model'"
Set-Content -Path "seed-data.ts" -Value $content -NoNewline
Write-Output "Done"
