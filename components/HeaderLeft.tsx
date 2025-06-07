import { StyleSheet, TouchableOpacity } from "react-native";
import { Menu } from "lucide-react-native";

type HeaderLeftProps = {
  onMenuPress: () => void;
};

export default function HeaderLeft({ onMenuPress }: HeaderLeftProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onMenuPress}>
      <Menu size={24} color="#333" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    marginRight: 8,
  },
});