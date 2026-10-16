/**
 * React Query hooks de moderació de mitjans
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { MediaModerationService } from '../services/MediaModerationService';
import { mapMediaReportFromDTO, mapModerationNoticeFromDTO } from '../services/mappers/MediaModerationMapper';
import { MediaReportAction, MediaReportReason } from '../models';
import { invalidateMediaQueries } from './mediaInvalidation';

/**
 * Denunciar un mitjà
 */
export function useReportMedia() {
  return useMutation({
    mutationFn: async (variables: {
      refugeId: string;
      mediaKey: string;
      reason: MediaReportReason;
      details?: string;
    }) => {
      await MediaModerationService.reportMedia({
        refuge_id: variables.refugeId,
        media_key: variables.mediaKey,
        reason: variables.reason,
        details: variables.details,
      });
      return variables;
    },
  });
}

/**
 * Denúncies per a admins (pendents o resoltes)
 */
export function useMediaReports(status: 'pending' | 'resolved', enabled = true) {
  return useQuery({
    queryKey: queryKeys.mediaReports(status),
    queryFn: async () => {
      const dtos = await MediaModerationService.getMediaReports(status);
      return dtos.map(mapMediaReportFromDTO);
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Resoldre una denúncia (dismiss | remove | remove_and_strike)
 */
export function useResolveMediaReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: {
      reportId: string;
      action: MediaReportAction;
      statement: string;
      refugeId?: string;
      creatorUid?: string | null;
    }) => {
      await MediaModerationService.resolveMediaReport(variables.reportId, {
        action: variables.action,
        statement: variables.statement,
      });
      return variables;
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mediaReports() });
      if (variables.action !== 'dismiss') {
        invalidateMediaQueries(queryClient, {
          refugeId: variables.refugeId,
          uid: variables.creatorUid || undefined,
        });
      }
    },
  });
}

/**
 * Avisos de moderació de l'usuari (perfil)
 */
export function useModerationNotices(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? queryKeys.moderationNotices(uid) : ['users', 'undefined', 'moderationNotices'],
    queryFn: async () => {
      if (!uid) return [];
      const dtos = await MediaModerationService.getModerationNotices(uid);
      return dtos.map(mapModerationNoticeFromDTO);
    },
    enabled: !!uid,
    retry: 0,
  });
}
