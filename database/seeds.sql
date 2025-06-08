-- Ejemplo de inserción de usuario y sus respuestas
INSERT INTO usuarios (codigo_estudiante) VALUES ('T0000YEE0');
INSERT INTO resp_cognitiva (id_usuario, ptj_fisica, ptj_quimica, ptj_biologia, ptj_matematicas)
VALUES (1, 80, 75, 85, 90);
INSERT INTO resp_educativa_familiar (id_usuario, colegio, ciudad_colegio)
VALUES (1, 'Colegio Ejemplo', 'Bogotá');
INSERT INTO resp_socioeconomica (id_usuario, estrato, becas)
VALUES (1, 'ESTRATO 4', 'Ninguna');
INSERT INTO resp_autoeficacia (id_usuario, creditos_matriculados, creditos_ganadas)
VALUES (1, 24, 20);