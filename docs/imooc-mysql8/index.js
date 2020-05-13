module.exports = () => {
  return [
    '',
    '01.md',
    '02/',
    '03/',
    '04/',
    {
      title: '日常工作 DCL、DDL',
      children: [
        '05/',
        '05/01.md',
        '05/02.md'
      ]
    },
    {
      title: '高阶技能：DML & 常用函数',
      children: [
        '06/',
        '06/01.md',
        '06/02.md',
        '06/03.md',
        '06/04.md'
      ]
    },
    {
      title: 'SQL 优化',
      children: [
        '07/'
      ]
    },
    {
      title: 'SQL 的索引优化',
      children: [
        '08/'
      ]
    },
    {
      title: '事务与并发控制',
      children: [
        '09/'
      ]
    }
  ]
}
