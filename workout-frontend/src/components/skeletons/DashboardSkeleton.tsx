import { Box, Grid, Skeleton, Stack, useMediaQuery, useTheme } from '@mui/material';
import TossCard from '../TossCard';

const DashboardSkeleton = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ pb: 8, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Skeleton variant="text" width={120} height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={180} height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={200} height={24} />
        </Box>
        {!isMobile && (
          <Skeleton variant="rectangular" width={140} height={52} sx={{ borderRadius: '12px' }} />
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <TossCard>
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="text" width={100} height={32} />
          </Box>
          <Skeleton variant="rectangular" width="100%" height={160} sx={{ borderRadius: '12px' }} />
        </TossCard>
      </Box>

      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, md: 7, lg: 8 }} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 1 }}>
             <Skeleton variant="text" width={150} height={24} sx={{ mb: 1 }} />
             <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
               <Skeleton variant="text" width={180} height={48} />
             </Box>
          </Box>
          <TossCard sx={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, p: 2 }}>
              <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '12px' }} />
            </Box>
          </TossCard>
        </Grid>


        <Grid size={{ xs: 12, md: 5, lg: 4 }} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Stack spacing={3} sx={{ height: '100%', flex: 1 }}>
            
            <TossCard sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton variant="text" width={100} height={32} />
                </Box>
              </Box>
              <Skeleton variant="text" width={120} height={48} sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {[1, 2, 3].map((i) => (
                  <Grid size={{ xs: 4 }} key={i}>
                    <Skeleton variant="text" width={50} height={20} />
                    <Skeleton variant="text" width={60} height={32} />
                  </Grid>
                ))}
              </Grid>
            </TossCard>

            <Grid container spacing={2}>
              {[1, 2].map((i) => (
                <Grid size={{ xs: 6 }} key={i}>
                  <TossCard>
                    <Skeleton variant="text" width={60} height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width={80} height={40} />
                  </TossCard>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardSkeleton;
