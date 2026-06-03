import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function upsertTenant(id: string, data: any) {
  return prisma.tenant.upsert({ where: { id }, create: { id, ...data }, update: {} });
}

async function upsertUser(id: string, data: any) {
  return prisma.user.upsert({ where: { id }, create: { id, ...data }, update: {} });
}

async function upsertCompany(id: string, data: any) {
  return prisma.company.upsert({ where: { id }, create: { id, ...data }, update: {} });
}

async function upsertWorker(id: string, data: any) {
  return prisma.worker.upsert({ where: { id }, create: { id, ...data }, update: {} });
}

async function upsertProject(id: string, data: any) {
  return prisma.project.upsert({ where: { id }, create: { id, ...data }, update: {} });
}

async function upsertContract(id: string, data: any) {
  return prisma.contract.upsert({ where: { id }, create: { id, ...data }, update: {} });
}

async function upsertRule(id: string, data: any) {
  return prisma.complianceRule.upsert({ where: { id }, create: { id, ...data }, update: {} });
}

async function upsertAssignment(id: string, data: any) {
  return prisma.complianceRuleAssignment.upsert({ where: { id }, create: { id, ...data }, update: {} });
}

async function upsertDocument(id: string, data: any) {
  return prisma.document.upsert({ where: { id }, create: { id, ...data }, update: {} });
}

async function main() {
  console.log('🌱 Sembrando datos de prueba...\n');

  // ─── TENANT ───────────────────────────────────────────────────────
  const tenantId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

  const tenant = await upsertTenant(tenantId, {
    nombre: 'ESMAX Lubricantes S.A.',
    rut: '76.123.456-7',
    giro: 'Comercialización de lubricantes y combustibles',
    direccion: 'Av. Américo Vespucio 1000, Santiago',
    telefono: '+56 2 2123 4000',
    correo: 'contacto@esmax.cl',
    estado: 'ACTIVO'
  });
  console.log('✅ Tenant creado:', tenant.nombre);

  // ─── USUARIOS ────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const revisorPassword = await bcrypt.hash('Revisor123!', 12);
  const contratistaPassword = await bcrypt.hash('Contratista123!', 12);

  await upsertUser('user-admin-001', {
    tenantId: tenantId,
    email: 'admin@esmax.cl',
    password: adminPassword,
    nombre: 'Admin',
    apellido: 'ESMAX',
    rut: '11.111.111-1',
    telefono: '+56 9 1111 1111',
    rol: 'ADMIN',
    cargo: 'Administrador del Sistema',
    activo: true
  });

  await upsertUser('user-revisor-001', {
    tenantId: tenantId,
    email: 'revisor@esmax.cl',
    password: revisorPassword,
    nombre: 'María',
    apellido: 'González',
    rut: '22.222.222-2',
    telefono: '+56 9 2222 2222',
    rol: 'REVISOR',
    cargo: 'Revisor Documental',
    activo: true
  });

  await upsertUser('user-contratista-001', {
    tenantId: tenantId,
    email: 'contratista@constructora.cl',
    password: contratistaPassword,
    nombre: 'Carlos',
    apellido: 'Muñoz',
    rut: '33.333.333-3',
    telefono: '+56 9 3333 3333',
    rol: 'CONTRATISTA',
    cargo: 'Encargado de Seguridad',
    activo: true
  });
  console.log('✅ Usuarios creados (3): admin@esmax.cl, revisor@esmax.cl, contratista@constructora.cl');

  // ─── EMPRESAS CONTRATISTAS ───────────────────────────────────────
  const empresa1 = await upsertCompany('emp-001', {
    tenantId: tenantId,
    razonSocial: 'Constructora del Sur SpA',
    rut: '77.888.999-0',
    giro: 'Construcción de obras civiles',
    direccion: 'Av. Providencia 1234, Santiago',
    telefono: '+56 2 2123 4567',
    correo: 'contacto@constructorasur.cl',
    representanteLegal: 'Juan Pérez Soto',
    estado: 'ACTIVO'
  });

  const empresa2 = await upsertCompany('emp-002', {
    tenantId: tenantId,
    razonSocial: 'Servicios Mineros Ltda.',
    rut: '88.777.666-5',
    giro: 'Servicios de mantención minera',
    direccion: 'Calle Comercio 456, Antofagasta',
    telefono: '+56 55 2345 6789',
    correo: 'admin@servmineros.cl',
    representanteLegal: 'Ana Martínez Ríos',
    estado: 'ACTIVO'
  });

  await upsertCompany('emp-003', {
    tenantId: tenantId,
    razonSocial: 'Transportes del Norte EIRL',
    rut: '99.111.222-3',
    giro: 'Transporte de carga y logística',
    direccion: 'Av. Balmaceda 789, Iquique',
    telefono: '+56 57 2123 4567',
    correo: 'info@transportesnorte.cl',
    representanteLegal: 'Roberto Díaz Campos',
    estado: 'ACTIVO'
  });
  console.log('✅ Empresas contratistas creadas (3)');

  // ─── TRABAJADORES ────────────────────────────────────────────────
  const w1 = await upsertWorker('trab-001', {
    companyId: empresa1.id,
    nombreCompleto: 'Pedro Ramírez López',
    rut: '15.234.567-8',
    fechaNacimiento: new Date('1990-03-15'),
    cargo: 'Operador Camión',
    correo: 'pedro.ramirez@constructorasur.cl',
    telefono: '+56 9 8765 4321',
    estado: 'ACTIVO'
  });

  const w2 = await upsertWorker('trab-002', {
    companyId: empresa1.id,
    nombreCompleto: 'Luis Vargas Torres',
    rut: '16.345.678-9',
    fechaNacimiento: new Date('1988-07-22'),
    cargo: 'Conductor Camión',
    correo: 'luis.vargas@constructorasur.cl',
    telefono: '+56 9 7654 3210',
    estado: 'ACTIVO'
  });

  const w3 = await upsertWorker('trab-003', {
    companyId: empresa2.id,
    nombreCompleto: 'Carmen Soto Vega',
    rut: '17.456.789-0',
    fechaNacimiento: new Date('1992-11-08'),
    cargo: 'Operador Equipos',
    correo: 'carmen.soto@servmineros.cl',
    telefono: '+56 9 6543 2109',
    estado: 'ACTIVO'
  });

  await upsertWorker('trab-004', {
    companyId: empresa2.id,
    nombreCompleto: 'Jorge Martínez Rojas',
    rut: '18.567.890-1',
    fechaNacimiento: new Date('1985-05-20'),
    cargo: 'Soldador',
    correo: 'jorge.martinez@servmineros.cl',
    telefono: '+56 9 5432 1098',
    estado: 'ACTIVO'
  });

  await upsertWorker('trab-005', {
    companyId: empresa1.id,
    nombreCompleto: 'Ana Flores Muñoz',
    rut: '19.678.901-2',
    fechaNacimiento: new Date('1995-09-12'),
    cargo: 'Supervisor de Terreno',
    correo: 'ana.flores@constructorasur.cl',
    telefono: '+56 9 4321 0987',
    estado: 'ACTIVO'
  });
  console.log('✅ Trabajadores creados (5)');

  // ─── PROYECTOS ──────────────────────────────────────────────────
  const proy1 = await upsertProject('proy-001', {
    tenantId: tenantId,
    nombre: 'Ampliación Planta Quilicura',
    cliente: 'ESMAX Lubricantes S.A.',
    fechaInicio: new Date('2026-01-15'),
    fechaTermino: new Date('2026-12-31'),
    estado: 'ACTIVO'
  });

  const proy2 = await upsertProject('proy-002', {
    tenantId: tenantId,
    nombre: 'Mantención Faena Antofagasta',
    cliente: 'Minería del Norte S.A.',
    fechaInicio: new Date('2026-03-01'),
    fechaTermino: new Date('2026-09-30'),
    estado: 'ACTIVO'
  });

  await upsertProject('proy-003', {
    tenantId: tenantId,
    nombre: 'Construcción Estación Servicio Rancagua',
    cliente: 'ESMAX Lubricantes S.A.',
    fechaInicio: new Date('2026-06-01'),
    fechaTermino: new Date('2027-03-31'),
    estado: 'PLANIFICADO'
  });
  console.log('✅ Proyectos creados (3)');

  // ─── CONTRATOS ──────────────────────────────────────────────────
  await upsertContract('cont-001', {
    tenantId: tenantId,
    companyId: empresa1.id,
    projectId: proy1.id,
    numeroContrato: 'CONT-2026-001',
    fechaInicio: new Date('2026-01-15'),
    fechaTermino: new Date('2026-12-31'),
    estado: 'ACTIVO'
  });

  await upsertContract('cont-002', {
    tenantId: tenantId,
    companyId: empresa2.id,
    projectId: proy2.id,
    numeroContrato: 'CONT-2026-002',
    fechaInicio: new Date('2026-03-01'),
    fechaTermino: new Date('2026-09-30'),
    estado: 'ACTIVO'
  });

  await upsertContract('cont-003', {
    tenantId: tenantId,
    companyId: empresa1.id,
    projectId: proy2.id,
    numeroContrato: 'CONT-2026-003',
    fechaInicio: new Date('2026-04-01'),
    fechaTermino: new Date('2026-09-30'),
    estado: 'ACTIVO'
  });
  console.log('✅ Contratos creados (3)');

  // ─── REGLAS DE CUMPLIMIENTO ────────────────────────────────────
  const rule1 = await upsertRule('rule-001', {
    tenantId: tenantId,
    nombre: 'Licencia A4 Vigente',
    descripcion: 'Operadores deben tener licencia A4 vigente para conducción de camiones',
    tipoDocumento: 'LICENCIA_CONDUCIR',
    cargo: 'Operador Camión',
    obligatorio: true,
    diasAdvertencia: 30,
    activo: true
  });

  const rule2 = await upsertRule('rule-002', {
    tenantId: tenantId,
    nombre: 'Examen Ocupacional Vigente',
    descripcion: 'Examen ocupacional anual obligatorio para todo trabajador',
    tipoDocumento: 'EXAMEN_OCUPACIONAL',
    cargo: '',
    obligatorio: true,
    diasAdvertencia: 30,
    activo: true
  });

  const rule3 = await upsertRule('rule-003', {
    tenantId: tenantId,
    nombre: 'Inducción de Seguridad ESMAX',
    descripcion: 'Inducción general de seguridad vigente para faenas ESMAX',
    tipoDocumento: 'INDUCCION',
    cargo: '',
    obligatorio: true,
    diasAdvertencia: 15,
    activo: true
  });

  const rule4 = await upsertRule('rule-004', {
    tenantId: tenantId,
    nombre: 'Certificado Mutualidad Vigente',
    descripcion: 'Certificado de mutualidad vigente para la empresa contratista',
    tipoDocumento: 'CERTIFICADO_MUTUALIDAD',
    cargo: '',
    obligatorio: true,
    diasAdvertencia: 60,
    activo: true
  });

  await upsertRule('rule-005', {
    tenantId: tenantId,
    nombre: 'Curso Trabajo en Altura',
    descripcion: 'Certificado de curso de trabajo en altura vigente',
    tipoDocumento: 'CURSO_ALTURA',
    cargo: 'Operador Equipos',
    obligatorio: true,
    diasAdvertencia: 45,
    activo: true
  });
  console.log('✅ Reglas de cumplimiento creadas (5)');

  // ─── ASIGNACIONES DE REGLAS ────────────────────────────────────
  await upsertAssignment('asig-001', {
    ruleId: rule1.id,
    projectId: proy1.id,
    companyId: empresa1.id
  });

  await upsertAssignment('asig-002', {
    ruleId: rule2.id,
    projectId: proy1.id,
    companyId: empresa1.id
  });

  await upsertAssignment('asig-003', {
    ruleId: rule3.id,
    projectId: proy2.id,
    companyId: empresa2.id
  });

  await upsertAssignment('asig-004', {
    ruleId: rule4.id,
    projectId: proy1.id,
    companyId: empresa1.id
  });

  await upsertAssignment('asig-005', {
    ruleId: (await prisma.complianceRule.findUnique({ where: { id: 'rule-005' } }))!.id,
    projectId: proy2.id,
    companyId: empresa2.id
  });
  console.log('✅ Asignaciones de reglas creadas (5)');

  // ─── DOCUMENTOS ─────────────────────────────────────────────────
  const hoy = new Date();
  const en15dias = new Date(hoy.getTime() + 15 * 86400000);
  const en30dias = new Date(hoy.getTime() + 30 * 86400000);
  const vencido = new Date(hoy.getTime() - 5 * 86400000);
  const vigente = new Date(hoy.getTime() + 180 * 86400000);

  // Documento 1: Licencia de conducir - próximo a vencer (15 días)
  await upsertDocument('doc-001', {
    tenantId: tenantId,
    companyId: empresa1.id,
    workerId: w1.id,
    categoria: 'TRABAJADOR',
    tipoDocumento: 'LICENCIA_CONDUCIR',
    nombreArchivo: 'licencia_a4_pedro_ramirez.pdf',
    rutaArchivo: '/uploads/licencia_a4_pedro_ramirez.pdf',
    tamanoBytes: 245760,
    tipoMIME: 'application/pdf',
    hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    metadata: JSON.stringify({ nombre: 'Pedro Ramírez', rut: '15.234.567-8', tipo: 'A4' }),
    fechaEmision: new Date('2026-01-15'),
    fechaVencimiento: en15dias,
    numeroDocumento: 'LIC-123456',
    organismoEmisor: 'Ministerio de Transportes',
    estado: 'APROBADO',
    estadoAcreditacion: 'ACREDITADO',
    observacionesIA: 'Documento vigente. Vence en aproximadamente 15 días.',
    recomendacionesIA: 'Renovar licencia de conducir próximamente para evitar discontinuidad.',
    scoreIA: 0.95
  });

  // Documento 2: Examen ocupacional - VENCIDO
  await upsertDocument('doc-002', {
    tenantId: tenantId,
    companyId: empresa1.id,
    workerId: w1.id,
    categoria: 'TRABAJADOR',
    tipoDocumento: 'EXAMEN_OCUPACIONAL',
    nombreArchivo: 'examen_ocupacional_pedro_ramirez.pdf',
    rutaArchivo: '/uploads/examen_ocupacional_pedro_ramirez.pdf',
    tamanoBytes: 512000,
    tipoMIME: 'application/pdf',
    hash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    metadata: JSON.stringify({ nombre: 'Pedro Ramírez', rut: '15.234.567-8' }),
    fechaEmision: new Date('2025-06-01'),
    fechaVencimiento: vencido,
    numeroDocumento: 'EXO-789012',
    organismoEmisor: 'Mutual de Seguridad CChC',
    estado: 'RECHAZADO',
    estadoAcreditacion: 'NO_ACREDITADO',
    observacionesIA: 'Examen ocupacional vencido hace 5 días.',
    recomendacionesIA: 'Realizar nuevo examen ocupacional con carácter urgente.',
    scoreIA: 0.88
  });

  // Documento 3: Inducción de seguridad - VIGENTE
  await upsertDocument('doc-003', {
    tenantId: tenantId,
    companyId: empresa2.id,
    workerId: w3.id,
    categoria: 'TRABAJADOR',
    tipoDocumento: 'INDUCCION',
    nombreArchivo: 'induccion_seguridad_carmen_soto.pdf',
    rutaArchivo: '/uploads/induccion_seguridad_carmen_soto.pdf',
    tamanoBytes: 180224,
    tipoMIME: 'application/pdf',
    hash: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    metadata: JSON.stringify({ nombre: 'Carmen Soto', rut: '17.456.789-0' }),
    fechaEmision: new Date('2026-02-01'),
    fechaVencimiento: vigente,
    numeroDocumento: 'IND-345678',
    organismoEmisor: 'ESMAX Capacitaciones',
    estado: 'APROBADO',
    estadoAcreditacion: 'ACREDITADO',
    observacionesIA: 'Documento en regla y vigente. Sin observaciones.',
    scoreIA: 0.97
  });

  // Documento 4: Certificado Mutualidad - PENDIENTE, próximo a vencer (30 días)
  await upsertDocument('doc-004', {
    tenantId: tenantId,
    companyId: empresa1.id,
    categoria: 'EMPRESA',
    tipoDocumento: 'CERTIFICADO_MUTUALIDAD',
    nombreArchivo: 'certificado_mutualidad_constructora_sur.pdf',
    rutaArchivo: '/uploads/certificado_mutualidad_constructora_sur.pdf',
    tamanoBytes: 320000,
    tipoMIME: 'application/pdf',
    hash: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
    metadata: JSON.stringify({ empresa: 'Constructora del Sur SpA', rut: '77.888.999-0' }),
    fechaEmision: new Date('2026-01-01'),
    fechaVencimiento: en30dias,
    numeroDocumento: 'MUT-901234',
    organismoEmisor: 'Mutual de Seguridad CChC',
    estado: 'PENDIENTE',
    estadoAcreditacion: 'EN_REVISION',
    observacionesIA: 'Documento válido próximo a vencer. Pendiente de renovación.',
    recomendacionesIA: 'Gestionar renovación del certificado de mutualidad.',
    scoreIA: 0.82
  });

  // Documento 5: Certificado de curso en altura - VIGENTE (proyecto 2)
  await upsertDocument('doc-005', {
    tenantId: tenantId,
    companyId: empresa2.id,
    workerId: w3.id,
    categoria: 'TRABAJADOR',
    tipoDocumento: 'CURSO_ALTURA',
    nombreArchivo: 'curso_altura_carmen_soto.pdf',
    rutaArchivo: '/uploads/curso_altura_carmen_soto.pdf',
    tamanoBytes: 150000,
    tipoMIME: 'application/pdf',
    hash: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
    metadata: JSON.stringify({ nombre: 'Carmen Soto', rut: '17.456.789-0', tipo: 'Trabajo en Altura' }),
    fechaEmision: new Date('2026-03-01'),
    fechaVencimiento: vigente,
    numeroDocumento: 'ALT-567890',
    organismoEmisor: 'Mutual de Seguridad CChC',
    estado: 'APROBADO',
    estadoAcreditacion: 'ACREDITADO',
    observacionesIA: 'Certificado vigente y en regla.',
    recomendacionesIA: 'Programar renovación antes del vencimiento.',
    scoreIA: 0.98
  });

  // Documento 6: Contrato empresa - VIGENTE
  await upsertDocument('doc-006', {
    tenantId: tenantId,
    companyId: empresa1.id,
    categoria: 'EMPRESA',
    tipoDocumento: 'CONTRATO',
    nombreArchivo: 'contrato_const_001.pdf',
    rutaArchivo: '/uploads/contrato_const_001.pdf',
    tamanoBytes: 1024000,
    tipoMIME: 'application/pdf',
    hash: 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
    metadata: JSON.stringify({ empresa: 'Constructora del Sur SpA', numero: 'CONT-2026-001' }),
    fechaEmision: new Date('2026-01-15'),
    fechaVencimiento: new Date('2026-12-31'),
    numeroDocumento: 'CONT-2026-001',
    organismoEmisor: 'ESMAX Lubricantes S.A.',
    estado: 'APROBADO',
    estadoAcreditacion: 'ACREDITADO',
    observacionesIA: 'Contrato vigente. Sin observaciones.',
    scoreIA: 0.99
  });

  console.log('✅ Documentos creados (6)');
  console.log('\n🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
