import { NextRequest, NextResponse } from 'next/server';
import { TagRule } from '@/lib/database/models';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    let { expression, testData } = body;

    if (!expression && id !== '0') {
      const tagRule = await TagRule.findByPk(id);
      if (tagRule) {
        const ruleData = tagRule.toJSON() as any;
        expression = ruleData.expression;
      }
    }

    if (!expression) {
      return NextResponse.json(
        { success: false, message: '规则表达式不存在' },
        { status: 400 }
      );
    }

    const testRecordData = testData || {
      id: 1,
      name: '测试用户',
      age: 25,
      gender: '男',
      email: 'test@example.com',
    };

    try {
      const keys = Object.keys(testRecordData);
      
      const evalCode = `
        const { ${keys.join(', ')} } = data;
        return ${expression};
      `;

      const evalFunc = new Function('data', evalCode);
      const result = evalFunc(testRecordData);

      return NextResponse.json({
        success: true,
        data: {
          expression,
          testData: testRecordData,
          result,
        },
        message: result ? '条件匹配成功' : '条件不匹配',
      });
    } catch (evalError: any) {
      return NextResponse.json(
        { success: false, message: `表达式解析错误: ${evalError.message}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('测试标签规则失败:', error);
    return NextResponse.json(
      { success: false, message: '测试标签规则失败' },
      { status: 500 }
    );
  }
}
