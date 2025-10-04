import bcrypt from 'bcryptjs';
/*
const password = 'adminbetter';
const hash = bcrypt.hashSync(password, 10);
console.log('Password:', password);
console.log('Hash:', hash);*/



const password = 'pl123';
const hash = bcrypt.hashSync(password, 10);
console.log('Password:', password);
console.log('Hash:', hash);