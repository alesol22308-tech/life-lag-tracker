import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { exportToJSON, exportToCSV, generateExportFilename, ExportData, ExportCheckin } from '@/lib/export';

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Authenticate user
    const { user, error: authError } = await requireAuth(supabase);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get format from query params
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    if (format !== 'json' && format !== 'csv') {
      return NextResponse.json({ error: 'Invalid format. Use "json" or "csv"' }, { status: 400 });
    }

    // Fetch all check-ins for the user
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('id, created_at, lag_score, drift_category, weakest_dimension, answers, reflection_notes, score_delta, narrative_summary')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (checkinsError) {
      console.error('Error fetching check-ins for export:', checkinsError);
      
      // If reflection_notes column doesn't exist, try without it
      if (checkinsError.message?.includes('column') || checkinsError.code === 'PGRST116') {
        const { data: checkinsFallback, error: errorFallback } = await supabase
          .from('checkins')
          .select('id, created_at, lag_score, drift_category, weakest_dimension, answers, score_delta, narrative_summary')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (errorFallback) {
          return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
        }

        // Use fallback data
        const exportData: ExportData = {
          user_id: user.id,
          export_date: new Date().toISOString(),
          total_checkins: checkinsFallback?.length || 0,
          checkins: (checkinsFallback || []) as ExportCheckin[],
        };

        return generateExportResponse(exportData, format);
      }

      return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
    }

    // Prepare export data
    const exportData: ExportData = {
      user_id: user.id,
      export_date: new Date().toISOString(),
      total_checkins: checkins?.length || 0,
      checkins: (checkins || []) as ExportCheckin[],
    };

    return generateExportResponse(exportData, format);
  } catch (error: any) {
    console.error('Error in export API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

function generateExportResponse(exportData: ExportData, format: 'json' | 'csv'): NextResponse {
  const filename = generateExportFilename(format);

  if (format === 'json') {
    const jsonData = exportToJSON(exportData);
    
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } else {
    const csvData = exportToCSV(exportData);
    
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }
}
