export const concertErrorCodes = {
  fetchError: 'CONCERTS_FETCH_ERROR',
  notFound: 'CONCERT_NOT_FOUND',
  availabilityCheckError: 'AVAILABILITY_CHECK_ERROR',
  validationError: 'CONCERT_VALIDATION_ERROR',
  databaseError: 'CONCERT_DATABASE_ERROR',
} as const;

export type ConcertServiceError = {
  code: typeof concertErrorCodes[keyof typeof concertErrorCodes];
  message: string;
};
