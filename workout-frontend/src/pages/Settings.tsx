import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Stack, useTheme } from '@mui/material';
import { userService } from '../services/userService';
import type { UserProfile } from '../types';
import VerticalScrollSelector from '../components/VerticalScrollSelector';
import NumberInputSelector from '../components/NumberInputSelector';
import BottomSheet from '../components/BottomSheet';
import SuccessFeedback from '../components/SuccessFeedback';

const Settings = () => {
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [showAgePicker, setShowAgePicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [success, setSuccess] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await userService.getProfile();
        setProfile(data);
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      await userService.updateProfile(profile);
      setSuccess(true);
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  const ages = Array.from({ length: 90 }, (_, i) => i + 10);

  return (
    <Box sx={{ pb: 10 }}>
      <Typography variant="h4" fontWeight="800" sx={{ mb: 4 }}>설정</Typography>
      
      <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>내 정보</Typography>
      <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 4, border: `1px solid ${theme.palette.divider}` }} elevation={0}>
        <Box 
            onClick={() => setShowAgePicker(true)}
            sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: `1px solid ${theme.palette.divider}`, '&:hover': { bgcolor: 'action.hover' } }}
        >
            <Typography fontWeight="600">나이</Typography>
            <Typography color="primary.main" fontWeight="700">{profile.age ? `${profile.age}세` : '설정하기'}</Typography>
        </Box>
        
        <Box 
            onClick={() => setShowWeightPicker(true)}
            sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        >
            <Typography fontWeight="600">몸무게</Typography>
            <Typography color="primary.main" fontWeight="700">{profile.weight ? `${profile.weight}kg` : '설정하기'}</Typography>
        </Box>
      </Paper>

      <Typography variant="h6" fontWeight="700" sx={{ mt: 4, mb: 2 }}>신체 구성</Typography>
      <Paper sx={{ p: 3, borderRadius: 4, border: `1px solid ${theme.palette.divider}` }} elevation={0}>
         <Stack spacing={3}>
             <Box>
                 <Typography variant="caption" color="text.secondary" fontWeight="600" display="block" mb={1}>골격근량 (kg)</Typography>
                 <NumberInputSelector 
                    type="decimal" 
                    value={profile.skeletalMuscleMass || 0} 
                    onChange={(val) => setProfile(prev => ({ ...prev, skeletalMuscleMass: val }))}
                    min={0} max={100} step={0.1} suffix="kg"
                 />
             </Box>
             <Box>
                 <Typography variant="caption" color="text.secondary" fontWeight="600" display="block" mb={1}>체지방량 (kg)</Typography>
                 <NumberInputSelector 
                    type="decimal" 
                    value={profile.bodyFatMass || 0} 
                    onChange={(val) => setProfile(prev => ({ ...prev, bodyFatMass: val }))}
                    min={0} max={100} step={0.1} suffix="kg"
                 />
             </Box>
         </Stack>
      </Paper>

      <Button 
        variant="contained" 
        fullWidth 
        size="large" 
        sx={{ mt: 4, height: 56, borderRadius: 4, fontWeight: 700, fontSize: '1.1rem' }}
        onClick={handleSave}
      >
        저장하기
      </Button>

      <BottomSheet open={showAgePicker} onClose={() => setShowAgePicker(false)} title="나이 선택">
        <VerticalScrollSelector 
            values={ages} 
            selectedValue={profile.age || 25} 
            onChange={(val) => setProfile(prev => ({ ...prev, age: val }))}
            suffix="세"
        />
        <Button fullWidth variant="contained" sx={{ mt: 3, borderRadius: 3, height: 48 }} onClick={() => setShowAgePicker(false)}>확인</Button>
      </BottomSheet>

      <BottomSheet open={showWeightPicker} onClose={() => setShowWeightPicker(false)} title="몸무게 선택">
         <Box sx={{ py: 4 }}>
            <NumberInputSelector 
                type="decimal" 
                value={profile.weight || 60} 
                onChange={(val) => setProfile(prev => ({ ...prev, weight: val }))}
                min={30} max={150} step={0.1} suffix="kg"
            />
         </Box>
         <Button fullWidth variant="contained" sx={{ mt: 3, borderRadius: 3, height: 48 }} onClick={() => setShowWeightPicker(false)}>확인</Button>
      </BottomSheet>

      <SuccessFeedback open={success} onClose={() => setSuccess(false)} message="프로필이 저장되었습니다" />
    </Box>
  );
};

export default Settings;
