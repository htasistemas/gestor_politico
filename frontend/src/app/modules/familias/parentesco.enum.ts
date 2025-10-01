export enum GrauParentesco {
  PAI = 'pai',
  MAE = 'mae',
  FILHO_A = 'filho_a',
  FILHA = 'filha',
  FILHO = 'filho',
  IRMAO_A = 'irmao_a',
  PRIMO_A = 'primo_a',
  TIO_A = 'tio_a',
  SOBRINHO_A = 'sobrinho_a',
  CONJUGE = 'conjuge',
  AVO_O = 'avo_o',
  ENTEADO_A = 'enteado_a',
  RESPONSAVEL = 'responsavel',
  OUTRO = 'outro'
}

export const DESCRICOES_PARENTESCO: Record<GrauParentesco, string> = {
  [GrauParentesco.PAI]: 'Pai',
  [GrauParentesco.MAE]: 'Mãe',
  [GrauParentesco.FILHO_A]: 'Filho(a)',
  [GrauParentesco.FILHA]: 'Filha',
  [GrauParentesco.FILHO]: 'Filho',
  [GrauParentesco.IRMAO_A]: 'Irmão(ã)',
  [GrauParentesco.PRIMO_A]: 'Primo(a)',
  [GrauParentesco.TIO_A]: 'Tio(a)',
  [GrauParentesco.SOBRINHO_A]: 'Sobrinho(a)',
  [GrauParentesco.CONJUGE]: 'Cônjuge',
  [GrauParentesco.AVO_O]: 'Avô(ó)',
  [GrauParentesco.ENTEADO_A]: 'Enteado(a)',
  [GrauParentesco.RESPONSAVEL]: 'Responsável pela família',
  [GrauParentesco.OUTRO]: 'Outro'
};
