import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddVehicleModal({ visible, onClose, onAdd, insets }) {
  const [newPlate, setNewPlate] = useState('');
  const [newProvince, setNewProvince] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('');

  const handleSubmit = () => {
    if (!newPlate || !newProvince || !newModel || !newColor) {
      alert('Please fill in all vehicle information fields');
      return;
    }
    const fullPlate = `${newPlate} ${newProvince}`;
    const fullModel = `${newModel} (${newColor})`;

    onAdd(fullPlate, fullModel);
    setNewPlate('');
    setNewProvince('');
    setNewModel('');
    setNewColor('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/50 justify-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="w-full"
          >
            <View
              style={{ paddingBottom: Math.max(insets.bottom + 12, 24) }}
              className="bg-white rounded-t-3xl p-6 shadow-2xl space-y-4 max-w-lg mx-auto w-full"
            >
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-lg font-bold text-slate-900">Register New Vehicle</Text>
                <TouchableOpacity onPress={onClose} className="p-1.5 rounded-full bg-slate-100">
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
                <View className="space-y-3">
                  <View>
                    <Text className="text-slate-600 text-xs font-semibold mb-1">License Plate Number (e.g. 1AB 8924)</Text>
                    <TextInput
                      value={newPlate}
                      onChangeText={setNewPlate}
                      placeholder="e.g. 1AB 8924"
                      placeholderTextColor="#94a3b8"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        color: '#0f172a',
                        fontSize: 12
                      }}
                    />
                  </View>

                  <View>
                    <Text className="text-slate-600 text-xs font-semibold mb-1">Province / City (e.g. Bangkok)</Text>
                    <TextInput
                      value={newProvince}
                      onChangeText={setNewProvince}
                      placeholder="e.g. Bangkok"
                      placeholderTextColor="#94a3b8"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        color: '#0f172a',
                        fontSize: 12
                      }}
                    />
                  </View>

                  <View>
                    <Text className="text-slate-600 text-xs font-semibold mb-1">Vehicle Make & Model (e.g. Honda PCX 160)</Text>
                    <TextInput
                      value={newModel}
                      onChangeText={setNewModel}
                      placeholder="e.g. Honda PCX 160"
                      placeholderTextColor="#94a3b8"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        color: '#0f172a',
                        fontSize: 12
                      }}
                    />
                  </View>

                  <View>
                    <Text className="text-slate-600 text-xs font-semibold mb-1">Vehicle Color (e.g. White)</Text>
                    <TextInput
                      value={newColor}
                      onChangeText={setNewColor}
                      placeholder="e.g. White"
                      placeholderTextColor="#94a3b8"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        color: '#0f172a',
                        fontSize: 12
                      }}
                    />
                  </View>
                </View>
              </ScrollView>

              <View className="flex-row space-x-3 pt-3">
                <TouchableOpacity
                  onPress={onClose}
                  className="flex-1 bg-slate-100 border border-slate-200 p-3.5 rounded-xl items-center active:bg-slate-200"
                >
                  <Text className="text-slate-600 font-bold text-xs">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  className="flex-1 bg-blue-600 p-3.5 rounded-xl items-center shadow-md shadow-blue-500/25 active:opacity-90"
                >
                  <Text className="text-white font-bold text-xs">Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
