import bcrypt from 'bcryptjs';

console.log('Lecturer Pass: ');
const password = 'lecturer123';
const hash = bcrypt.hashSync(password, 10);
console.log('Password:', password);
console.log('Hash:', hash);


console.log('Principal Lecturer Pass: ');
const password1 = 'pri123';
const hash1 = bcrypt.hashSync(password1, 10);
console.log('Password:', password1);
console.log('Hash:', hash1);


console.log('Program Leader: ');
const password2 = 'pml123';
const hash2 = bcrypt.hashSync(password2, 10);
console.log('Password:', password2);
console.log('Hash:', hash2);

console.log('Admin: ');
const password3 = 'adminPha';
const hash3 = bcrypt.hashSync(password3, 10);
console.log('Password:', password3);
console.log('Hash:', hash3);