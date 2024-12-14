import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth';
import { MatchType } from '@prisma/client';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      type, 
      player1Id, 
      player2Id, 
      partnership1Id, 
      partnership2Id,
      tournamentName,
      eventName,
      location
    } = body;

    // Validate input based on match type
    if (type === 'SINGLES' && (!player1Id || !player2Id)) {
      return NextResponse.json({ 
        message: 'Both players are required for a singles match' 
      }, { status: 400 });
    }

    if (type === 'DOUBLES' && (!partnership1Id || !partnership2Id)) {
      return NextResponse.json({ 
        message: 'Both partnerships are required for a doubles match' 
      }, { status: 400 });
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        type: type as MatchType,
        player1Id: type === 'SINGLES' ? player1Id : null,
        player2Id: type === 'SINGLES' ? player2Id : null,
        partnership1Id: type === 'DOUBLES' ? partnership1Id : null,
        partnership2Id: type === 'DOUBLES' ? partnership2Id : null,
        tournamentName,
        eventName,
        location
      }
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error('Match creation error:', error);
    return NextResponse.json({ 
      message: 'Failed to create match', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
