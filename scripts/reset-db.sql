-- Limpa todas as mensagens e conversas
-- O CASCADE garante que ao limpar conversas, as mensagens filhas também sumam.

TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE conversations CASCADE;
